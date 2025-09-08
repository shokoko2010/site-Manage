const bcrypt = require('bcryptjs');

async function testBcrypt() {
  try {
    console.log('Testing bcrypt...');
    const password = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Hash successful:', hashedPassword);
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Compare successful:', isValid);
    
    console.log('Bcrypt test completed successfully');
  } catch (error) {
    console.error('Bcrypt test failed:', error);
  }
}

testBcrypt();