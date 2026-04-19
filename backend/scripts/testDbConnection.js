/**
 * Test if your machine can reach the Azure PostgreSQL server (TCP only).
 * Run: node scripts/testDbConnection.js
 * Uses .env for POSTGRES_HOST and POSTGRES_PORT.
 */
import dotenv from 'dotenv'
import net from 'net'
import https from 'https'

dotenv.config()

const host = process.env.POSTGRES_HOST || 'localhost'
const port = parseInt(process.env.POSTGRES_PORT || '5432', 10)

function getPublicIp() {
  return new Promise((resolve) => {
    const req = https.get('https://api.ipify.org?format=json', { timeout: 5000 }, (res) => {
      let data = ''
      res.on('data', (ch) => { data += ch })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).ip || 'unknown')
        } catch {
          resolve('unknown')
        }
      })
    })
    req.on('error', () => resolve('unknown'))
    req.on('timeout', () => { req.destroy(); resolve('unknown') })
  })
}

function testTcpConnection() {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const timeout = 10000
    let resolved = false

    const done = (ok, message) => {
      if (resolved) return
      resolved = true
      socket.destroy()
      resolve({ ok, message })
    }

    socket.setTimeout(timeout)
    socket.on('connect', () => done(true, `TCP connection to ${host}:${port} succeeded.`))
    socket.on('timeout', () => done(false, `TCP connection timed out after ${timeout / 1000}s.`))
    socket.on('error', (err) => done(false, `TCP error: ${err.message}`))

    socket.connect(port, host)
  })
}

async function main() {
  console.log('--- Database connectivity check ---\n')
  console.log('Host:', host)
  console.log('Port:', port)
  console.log('')

  const publicIp = await getPublicIp()
  console.log('Your current public IP (add this in Azure firewall):', publicIp)
  console.log('')

  console.log('Testing TCP connection (no SSL, no login)...')
  const { ok, message } = await testTcpConnection()
  console.log(message)

  if (ok) {
    console.log('\nNetwork path is open. If app still fails, check SSL/auth or run setup-db again.')
  } else {
    console.log('\nPossible causes:')
    console.log('1. Azure: Server must use "Public access" (not Private/VNet only).')
    console.log('2. Azure: Networking → Firewall: add rule for', publicIp, 'or 0.0.0.0-255.255.255.255 (test only).')
    console.log('3. Your ISP/network may block outbound port 5432 — try mobile hotspot.')
    console.log('4. Wrong server/host in .env or server is stopped.')
  }
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
