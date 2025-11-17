import localtunnel from 'localtunnel';

/**
 * Setup LocalTunnel for exposing backend to external devices
 * This is useful for testing with iOS devices or sharing with friends
 */
export async function setupLocalTunnel(port: number): Promise<string | null> {
  try {
    console.log('\n🌐 Starting LocalTunnel...');

    const tunnel = await localtunnel({ port });

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

    return tunnel.url;
  } catch (error) {
    console.error('❌ Failed to start LocalTunnel:', error);
    return null;
  }
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
