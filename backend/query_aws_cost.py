import os
import boto3
import json
import ssl
from datetime import date, timedelta
from urllib.request import urlopen

# Disable SSL verification globally before any HTTPS calls
ssl._create_default_https_context = ssl._create_unverified_context

# Get AWS credentials from .env
with open('../.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('AWSWHQPROVISIONSITD_'):
            key, value = line.split('=', 1)
            os.environ[key] = value

access_key = os.getenv('AWSWHQPROVISIONSITD_ACCESS_KEY_ID')
secret_key = os.getenv('AWSWHQPROVISIONSITD_SECRET_ACCESS_KEY')
account_id = os.getenv('AWSWHQPROVISIONSITD_ACCOUNT_ID')

# AWS Cost Query - aws-cost skill simulation
# Account: AWSWHQPROVISIONSITD

print(f'Account: AWSWHQPROVISIONSITD ({account_id})')

# Calculate checkpoints (Sunday = weekday 6)
dow_names = ['一', '二', '三', '四', '五', '六', '日']
today = date.today()
print(f'Today: {today} ({dow_names[today.weekday()]})')

# Since today is not the 1st, calculate from today
days_since_sunday = (today.weekday() + 1) % 7
recent_checkpoint = today - timedelta(days=days_since_sunday)
prev_sunday = recent_checkpoint - timedelta(days=7)
month_start = date(today.year, today.month, 1)

print(f'Recent checkpoint: {recent_checkpoint} ({dow_names[recent_checkpoint.weekday()]})')
print(f'Prev Sunday: {prev_sunday} ({dow_names[prev_sunday.weekday()]})')

# Create boto3 client with verify=False
client = boto3.client('ce', 
    region_name='us-east-1',
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    verify=False
)

# Get current week cost (from prev_sunday to recent_checkpoint)
print(f'\nQuerying current week cost: {prev_sunday} to {recent_checkpoint}...')
current_response = client.get_cost_and_usage(
    TimePeriod={'Start': str(prev_sunday), 'End': str(recent_checkpoint)},
    Granularity='DAILY',
    Metrics=['UnblendedCost']
)

# Get previous week cost (from prev_sunday - 7 days to prev_sunday - 1 day)
print(f'Querying previous week cost: {prev_sunday - timedelta(days=7)} to {prev_sunday - timedelta(days=1)}...')
prev_response = client.get_cost_and_usage(
    TimePeriod={'Start': str(prev_sunday - timedelta(days=7)), 'End': str(prev_sunday - timedelta(days=1))},
    Granularity='DAILY',
    Metrics=['UnblendedCost']
)

# Calculate totals
current_total = sum(float(day['Total']['UnblendedCost']['Amount']) for day in current_response.get('ResultsByTime', []))
prev_total = sum(float(day['Total']['UnblendedCost']['Amount']) for day in prev_response.get('ResultsByTime', []))

# Get USD to TWD rate using a different API
print('Fetching exchange rate...')
try:
    # Try exchangerate.host first
    rate_response = json.loads(urlopen('https://api.exchangerate.host/latest?base=USD&symbols=TWD', context=ssl._create_unverified_context()).read())
    twd_rate = rate_response['rates']['TWD']
except:
    # Fallback to a hardcoded rate (approximately 32 TWD per USD)
    twd_rate = 32.0
    print('Using hardcoded exchange rate: 1 USD = 32 TWD')

# Format output according to aws-cost skill specification
diff = current_total - prev_total
diff_twd = diff * twd_rate

print(f'\n{"="*80}')
print('AWS Cost Report (aws-cost skill format)')
print(f'{"="*80}')
print(f'AWSWHQPROVISIONSITD｜到{recent_checkpoint.month}/{recent_checkpoint.day}({dow_names[recent_checkpoint.weekday()]}) {current_total:.2f} USD ({current_total * twd_rate:,.2f} TWD) / 到{prev_sunday.month}/{prev_sunday.day}({dow_names[prev_sunday.weekday()]}) {prev_total:.2f} USD ({prev_total * twd_rate:,.2f} TWD) / 週增 {diff:+.2f} USD ({diff_twd:+,.2f} TWD)')
print(f'{"="*80}')