const { Sequelize } = require('sequelize')
const path = require('path')
// carregar .env a partir da raiz do projeto (garante que funciona mesmo executando de src/db)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mysql = require('mysql2/promise')

// lógica: se existir uma DATABASE_URL (mysql://user:pass@host:port/dbname) usa ela.
// Senão tenta variáveis separadas (DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT).
// Também aceita nomes típicos do Railway pode expor como:
// MYSQLHOST / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE / MYSQLPORT

function getConnectionConfig() {
  // 1) if DATABASE_URL provedor
  if (process.env.DATABASE_URL) {
    // Sequelize aceita connection URI diretamente
    return { uri: process.env.DATABASE_URL, options: { dialect: 'mysql', dialectOptions: {} } }
  }

  // 2) try Railway-like MYSQL_* env vars
  if (process.env.MYSQLDATABASE && process.env.MYSQLUSER && process.env.MYSQLPASSWORD) {
    const db = process.env.MYSQLDATABASE
    const user = process.env.MYSQLUSER
    const pass = process.env.MYSQLPASSWORD
    const host = process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST
    const port = process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT
    const uri = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`
    return { uri, options: { dialect: 'mysql', dialectOptions: {} } }
  }

  // 3) fallback to legacy DB_* vars (your .env)
  if (process.env.DB_NAME && process.env.DB_USER) {
    const db = process.env.DB_NAME
    const user = process.env.DB_USER || 'root'
    const pass = process.env.DB_PASS || 'krieger'
    const host = process.env.DB_HOST || 'localhost'
    const port = process.env.DB_PORT || 3306
    const uri = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`
    return { uri, options: { dialect: 'mysql', dialectOptions: {} } }
  }

  // 4) não encontrado -> lança erro com sugestão de como corrigir
  throw new Error('Nenhuma configuração de DB encontrada nas variáveis de ambiente. Verifique se o arquivo .env existe na raiz do projeto ou execute o script a partir da raiz.')
  
  // Defina DATABASE_URL OU MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD OU DB_NAME/DB_USER/DB_PASS
  
}

const { uri, options } = getConnectionConfig()

const sequelize = new Sequelize(uri, options)

// Exemplo de teste de conexão — logs claros
async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('Conexão com o banco realizada com sucesso!')
  } catch (err) {
    // Se o erro for database não encontrado, tente criar o banco e reconectar
    const isUnknownDb = err && err.parent && (err.parent.code === 'ER_BAD_DB_ERROR' || err.parent.errno === 1049)
    if (isUnknownDb) {
      try {
        // determina nome do DB (prefere variáveis de ambiente)
        let dbName = process.env.DB_NAME || process.env.MYSQLDATABASE
        if (!dbName) {
          try {
            const parsed = new URL(uri)
            dbName = parsed.pathname.replace(/^\//, '')
          } catch (e) {
            console.error('Não foi possível extrair o nome do DB da URI', e)
          }
        }
        if (!dbName) throw err

        // conecta ao servidor MySQL sem database para criar o DB
        const parsed = new URL(uri)
        const adminUri = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.hostname}:${parsed.port}`
        const conn = await mysql.createConnection(adminUri)
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
        await conn.end()
        console.log(`Banco '${dbName}' criado (ou já existia). Tentando reconectar...`)

        // re-tenta autenticação
        await sequelize.authenticate()
        console.log('Conexão com o banco realizada com sucesso após criar o DB!')
        return
      } catch (createErr) {
        console.error('Falha ao tentar criar o banco de dados automaticamente:', createErr)
      }
    }

    console.error('Erro ao conectar com banco de dados!', err)
    // opcional: process.exit(1)
  }
}
testConnection()

module.exports = sequelize
