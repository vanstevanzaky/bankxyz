const http = require('http');

async function run() {
  const registerData = JSON.stringify({ 
    username: 'testuser_' + Date.now(), 
    password: 'password123', 
    full_name: 'Test User', 
    email: 'test@example.com', 
    phone: '08123456789' 
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': registerData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Register response status:', res.statusCode);
      console.log('Register response body:', data);
    });
  });
  req.write(registerData);
  req.end();
}

run();
