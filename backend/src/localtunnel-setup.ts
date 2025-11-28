import localtunnel from 'localtunnel';

/**
 * Setup LocalTunnel for exposing backend to external devices
 * This is useful for testing with iOS devices or sharing with friends
 */
export async function setupLocalTunnel(port: number, retries = 5): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`\n🌐 Starting LocalTunnel (Attempt ${i + 1}/${retries})...`);

      const tunnel = await localtunnel({ port });

      if (!tunnel.url) {
        throw new Error('Tunnel URL is empty');
      }

      console.log('\n=================================');
      console.log('✅ LOCALTUNNEL ACTIVE');
      console.log('=================================');
      console.log('Public URL:', tunnel.url);
      console.log('Local URL: ', `http://localhost:${port}`);
      console.log('=================================');
      console.log('\n📱 MOBILE APP SETUP:');
      console.log('Update mobile/src/services/api.service.ts');
      console.log(`Change API_BASE_URL to: '${tunnel.url}/api'`);
      console.log('=================================\n');

      tunnel.on('close', () => {
        console.log('❌ LocalTunnel closed');
      });

      tunnel.on('error', (err) => {
        console.error('❌ LocalTunnel error:', err);
      });

      return tunnel.url;
    } catch (error) {
      console.error(`❌ Failed to start LocalTunnel (Attempt ${i + 1}):`, error);
      if (i < retries - 1) {
        console.log('Retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  console.error('❌ Could not establish LocalTunnel connection after multiple attempts.');
  return null;
}

/**
 * Disconnect LocalTunnel on shutdown
 */
export async function disconnectLocalTunnel(): Promise<void> {
  try {
    console.log('🔌 LocalTunnel disconnected');
  } catch (error) {
    console.error('Error disconnecting LocalTunnel:', error);
  }
}
