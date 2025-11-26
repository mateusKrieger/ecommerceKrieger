const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const MovimentoEstoque = db.define('movimentoEstoque', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idVendedor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idProduto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('ENTRADA', 'SAIDA'),
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  qtdeMovimento: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estoqueAntes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estoqueDepois: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'movimentos_estoque'
})

module.exports = MovimentoEstoque
