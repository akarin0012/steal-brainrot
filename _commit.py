# -*- coding: utf-8 -*-
import subprocess, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

dev = bytes.fromhex('e9968be799ba').decode('utf-8')
p = os.path.join(r'C:\Users\PC_User\Desktop', dev, 'steal-brainrot')
os.chdir(p)

r = subprocess.run(['git', 'add', '-A'], capture_output=True)
print('add:', r.returncode)

# fix: Low優先度の3件を修正（盗み判定のmutation倍率考慮・fusion入力バリデーション・[F]キー表示重複）
parts = [
    'fix: Low',
    bytes.fromhex('e584aae58588e5baa6').decode('utf-8'),  # 優先度
    bytes.fromhex('e381ae').decode('utf-8'),  # の
    '3',
    bytes.fromhex('e4bbb6e38292e4bfaee6ada3').decode('utf-8'),  # 件を修正
    bytes.fromhex('efbc88').decode('utf-8'),  # （
    bytes.fromhex('e79b97e381bfe58da4e5ae9ae381ae').decode('utf-8'),  # 盗み判定の
    'mutation',
    bytes.fromhex('e5808de78e87e88083e685ae').decode('utf-8'),  # 倍率考慮
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    'fusion',
    bytes.fromhex('e585a5e58a9be38390e383aae38387e383bce382b7e383a7e383b3').decode('utf-8'),  # 入力バリデーション
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    '[F]',
    bytes.fromhex('e382ade383bce8a1a8e7a4bae9878de8a487').decode('utf-8'),  # キー表示重複
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
