# -*- coding: utf-8 -*-
import subprocess, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

dev = bytes.fromhex('e9968be799ba').decode('utf-8')
p = os.path.join(r'C:\Users\PC_User\Desktop', dev, 'steal-brainrot')
os.chdir(p)

r = subprocess.run(['git', 'add', '-A'], capture_output=True)
print('add:', r.returncode)

parts = [
    'fix: Medium',
    bytes.fromhex('e584aae58588e5baa6').decode('utf-8'),  # 優先度
    '10',
    bytes.fromhex('e4bbb6e38292e4bfaee6ada3').decode('utf-8'),  # 件を修正
    bytes.fromhex('efbc88').decode('utf-8'),  # （
    'NPC',
    bytes.fromhex('e79b97e381bfe58e9fe5ad90e680a7').decode('utf-8'),  # 盗み原子性
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e382b3e383b3e38399e382a2').decode('utf-8'),  # コンベア
    'spawn',
    bytes.fromhex('e4bfaee6ada3').decode('utf-8'),  # 修正
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    'fusion',
    bytes.fromhex('e7a2bae78e87').decode('utf-8'),  # 確率
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e382bfe382a4e3839ee383bc').decode('utf-8'),  # タイマー
    bytes.fromhex('e695b4e59088e680a7').decode('utf-8'),  # 整合性
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e4bf9de5ad98e69c80e981a9e58c96').decode('utf-8'),  # 保存最適化
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e382a2e382a4e38386e383a0').decode('utf-8'),  # アイテム
    'ID',
    bytes.fromhex('efbc89').decode('utf-8'),  # ）
]
msg = ''.join(parts)

env = os.environ.copy()
env['GIT_AUTHOR_NAME'] = 'AI Assistant'
env['GIT_AUTHOR_EMAIL'] = 'ai@assistant.local'
env['GIT_COMMITTER_NAME'] = 'AI Assistant'
env['GIT_COMMITTER_EMAIL'] = 'ai@assistant.local'

r = subprocess.run(['git', 'commit', '-m', msg], capture_output=True, env=env)
print('commit stdout:', r.stdout.decode('utf-8', errors='replace'))
print('commit stderr:', r.stderr.decode('utf-8', errors='replace'))
print('commit exit:', r.returncode)

r = subprocess.run(['git', 'status', '--short'], capture_output=True)
print('status:', r.stdout.decode('utf-8', errors='replace'))

r = subprocess.run(['git', 'log', '--oneline', '-8'], capture_output=True)
print('log:', r.stdout.decode('utf-8', errors='replace'))
