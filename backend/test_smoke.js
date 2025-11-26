const http = require('http')

function request(method, path, body, headers = {}){
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: Object.assign({'Content-Type':'application/json'}, headers)
    }

    const req = http.request(opts, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data })
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

(async () => {
  try {
    console.log('--- GET / ---')
    console.log(await request('GET', '/'))

    console.log('--- POST /usuario ---')
    const user = { nome: 'Smoke User', email: 'smoke.user@example.com', telefone: '11999999999', cpf: '52998224725', senha: '123456' }
    console.log(await request('POST', '/usuario', user))

    console.log('--- POST /login ---')
    const login = { email: 'smoke.user@example.com', senha: '123456' }
    const loginRes = await request('POST', '/login', login)
    console.log(loginRes)

    let token = null
    try { token = JSON.parse(loginRes.body).token } catch(e){}

    console.log('--- GET /produto (no token) ---')
    console.log(await request('GET', '/produto'))

    console.log('--- GET /produto (with token) ---')
    if (token) {
      console.log(await request('GET', '/produto', null, { Authorization: `Bearer ${token}` }))
    } else {
      console.log('No token, skipped')
    }

  } catch (err) {
    console.error('Smoke test error', err)
    process.exit(1)
  }
})()
