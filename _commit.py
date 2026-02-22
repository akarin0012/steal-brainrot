import subprocess, os

p = os.path.join(r'C:\Users\PC_User\Desktop', bytes.fromhex('e9968be799ba').decode('utf-8'), 'steal-brainrot')

env = os.environ.copy()
env['GIT_AUTHOR_NAME'] = 'dev'
env['GIT_AUTHOR_EMAIL'] = 'dev@local'
env['GIT_COMMITTER_NAME'] = 'dev'
env['GIT_COMMITTER_EMAIL'] = 'dev@local'

subprocess.run('git add -A', cwd=p, shell=True, env=env)

# fix: Medium3件+Low2件修正(income再計算・stealDifficulty正規化・upgrade上限・エラー制御・input安全化)
msg = b'fix: Medium3\xe4\xbb\xb6+Low2\xe4\xbb\xb6\xe4\xbf\xae\xe6\xad\xa3(income\xe5\x86\x8d\xe8\xa8\x88\xe7\xae\x97\xe3\x83\xbbstealDifficulty\xe6\xad\xa3\xe8\xa6\x8f\xe5\x8c\x96\xe3\x83\xbbupgrade\xe4\xb8\x8a\xe9\x99\x90\xe3\x83\xbb\xe3\x82\xa8\xe3\x83\xa9\xe3\x83\xbc\xe5\x88\xb6\xe5\xbe\xa1\xe3\x83\xbbinput\xe5\xae\x89\xe5\x85\xa8\xe5\x8c\x96)'.decode('utf-8')

r = subprocess.run(['git', 'commit', '-m', msg], cwd=p, capture_output=True, env=env)
print(r.stdout.decode('utf-8', 'replace'))
print(r.stderr.decode('utf-8', 'replace'))
print('exit:', r.returncode)
