export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>OTP Relay API</h1>
      <p>This is a serverless API for OTP relay. No frontend UI is provided.</p>
      <p>Use the API endpoints:</p>
      <ul>
        <li><code>POST /api/otp</code> - Store OTP</li>
        <li><code>GET /api/otp?phone=...</code> - Retrieve OTP</li>
      </ul>
      <p>See README.md for documentation and examples.</p>
    </main>
  );
}

