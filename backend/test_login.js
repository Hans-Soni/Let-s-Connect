async function test() {
  try {
    const email = 'test_token_' + Date.now() + '@example.com';
    console.log("Signing up user:", email);
    
    const signupRes = await fetch('https://let-s-connect-backend.onrender.com/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: email,
        password: 'password123'
      })
    });
    
    const signupData = await signupRes.json();
    console.log("Signup Status:", signupRes.status);
    console.log("Signup Data:", signupData);
    
  } catch (error) {
    console.log("Error:", error);
  }
}
test();
