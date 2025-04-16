const { spawn, exec } = require('child_process');
const path = require('path');
const isWindows = process.platform === 'win32';
const http = require('http');
const { promisify } = require('util');

// Configuration
const PORT = 3003; // Using the port from your server configuration

// Start the Express server
console.log('Starting the Express server...');

// Use the correct command based on the operating system
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: isWindows // Use shell on Windows
});

// Handle server process events
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Start a new ngrok tunnel using the command line directly
setTimeout(async () => {
  try {
    console.log('Starting ngrok tunnel to create HTTPS URL...');
    
    // Check if we can access the ngrok API
    const checkNgrokAPI = () => {
      return new Promise((resolve) => {
        http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const tunnels = JSON.parse(data).tunnels;
              resolve(tunnels);
            } catch (e) {
              resolve(null);
            }
          });
        }).on('error', () => {
          resolve(null);
        });
      });
    };
    
    // First check if ngrok is already running and has tunnels
    const existingTunnels = await checkNgrokAPI();
    
    if (existingTunnels && existingTunnels.length > 0) {
      // Find if there's already a tunnel for our port
      const ourTunnel = existingTunnels.find(t => t.config.addr.includes(`:${PORT}`));
      
      if (ourTunnel) {
        console.log('\n========================================');
        console.log('🚀 Server is running!');
        console.log('----------------------------------------');
        console.log(`🔒 HTTPS URL: ${ourTunnel.public_url}`);
        console.log(`💻 Local HTTP URL: http://localhost:${PORT}`);
        console.log('========================================\n');
        console.log('Use the HTTPS URL in your mobile emulator for secure connections.');
        console.log('Press Ctrl+C to stop the server.\n');
        return;
      }
      
      // If there's no tunnel for our port but ngrok is running, we need to use a different approach
      console.log('Another ngrok instance is already running.');
      console.log(`You can still access the server via HTTP at http://localhost:${PORT}`);
      console.log('\nTo create an HTTPS tunnel, you have two options:');
      console.log('1. Stop the other ngrok instance and try again');
      console.log('2. Start a new ngrok tunnel manually with:');
      console.log(`   ngrok http ${PORT}`);
      console.log('\nPress Ctrl+C to stop the server.\n');
    } else {
      // If ngrok isn't running, try to start it
      const execPromise = promisify(exec);
      try {
        // Start ngrok in a separate process
        const ngrokProcess = spawn(isWindows ? 'ngrok.cmd' : 'ngrok', ['http', PORT.toString()], {
          detached: true,
          stdio: 'ignore',
          shell: isWindows
        });
        
        // Don't wait for this process
        ngrokProcess.unref();
        
        // Wait a bit for ngrok to start
        console.log('Starting ngrok tunnel, please wait...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for tunnels
        let retries = 5;
        let tunnels = null;
        
        while (retries > 0 && !tunnels) {
          tunnels = await checkNgrokAPI();
          if (!tunnels) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
          }
        }
        
        if (tunnels && tunnels.length > 0) {
          const tunnel = tunnels.find(t => t.config.addr.includes(`:${PORT}`));
          if (tunnel) {
            console.log('\n========================================');
            console.log('🚀 Server is running!');
            console.log('----------------------------------------');
            console.log(`🔒 HTTPS URL: ${tunnel.public_url}`);
            console.log(`💻 Local HTTP URL: http://localhost:${PORT}`);
            console.log('========================================\n');
            console.log('Use the HTTPS URL in your mobile emulator for secure connections.');
            console.log('Press Ctrl+C to stop the server.\n');
            return;
          }
        }
        
        console.log('Could not detect ngrok tunnel automatically.');
        console.log('Please check if ngrok is running by visiting http://localhost:4040');
        console.log(`You can still access the server via HTTP at http://localhost:${PORT}`);
      } catch (error) {
        console.error('Failed to start ngrok:', error);
        console.log(`\nYou can still access the server via HTTP at http://localhost:${PORT}`);
        console.log('To create an HTTPS tunnel manually, run:');
        console.log(`ngrok http ${PORT}`);
      }
    }
  } catch (error) {
    console.error('Error checking ngrok status:', error);
    console.log(`\nYou can still access the server via HTTP at http://localhost:${PORT}`);
  }
}, 3000); // Wait for server to start

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  
  // Kill server process
  server.kill();
  console.log('Server stopped.');
  
  process.exit(0);
});
