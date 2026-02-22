# -*- coding: utf-8 -*-
import subprocess, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

dev = bytes.fromhex('e9968be799ba').decode('utf-8')
p = os.path.join(r'C:\Users\PC_User\Desktop', dev, 'steal-brainrot')
os.chdir(p)

r = subprocess.run(['git', 'add', '-A'], capture_output=True)
print('add:', r.returncode)

parts = [
    'fix: NPC catch',
    bytes.fromhex('e69982e381aee8aaa4e382a2e382a4e38386e383a0e5898ae999a4e38292e998b2e6ada2').decode('utf-8'),  # 時の誤アイテム削除を防止
    bytes.fromhex('efbc88').decode('utf-8'),  # （
    'mutation',
    bytes.fromhex('e785a7e59088e8bfbde58aa0').decode('utf-8'),  # 照合追加
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e69caae4bdbfe794a8').decode('utf-8'),  # 未使用
    'import',
    bytes.fromhex('e5898ae999a4').decode('utf-8'),  # 削除
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
