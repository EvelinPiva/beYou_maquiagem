require('dotenv').config()
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { Usuario } = require('../models/rel')

// ──────────────────────────────────────────────────────────
// VALIDAÇÃO MATEMÁTICA DE CPF (algoritmo oficial)
// ──────────────────────────────────────────────────────────
function validarCPF(cpf) {
    // Remove formatação
    cpf = cpf.replace(/[^\d]/g, '')

    if (cpf.length !== 11) return false
    // Rejeita CPFs com todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false

    // Calcula 1º dígito verificador
    let soma = 0
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i)
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpf[9])) return false

    // Calcula 2º dígito verificador
    soma = 0
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i)
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpf[10])) return false

    return true
}

// ──────────────────────────────────────────────────────────
// POST /usuarios — Cadastro de novo usuário (PÚBLICO)
// ──────────────────────────────────────────────────────────
async function cadastrar(req, res) {
    try {
        const { nome, email, senha, telefone, cpf, identidade } = req.body

        // Campos obrigatórios
        if (!nome || !email || !senha || !telefone || !cpf) {
            return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha, telefone, cpf.' })
        }

        // Valida CPF matematicamente
        if (!validarCPF(cpf)) {
            return res.status(400).json({ erro: 'CPF inválido. Verifique os dígitos informados.' })
        }

        // Verifica duplicidade de e-mail
        const emailExiste = await Usuario.findOne({ where: { email } })
        if (emailExiste) {
            return res.status(409).json({ erro: 'E-mail já cadastrado.' })
        }

        // Verifica duplicidade de CPF
        const cpfLimpo = cpf.replace(/[^\d]/g, '')
        const cpfExiste = await Usuario.findOne({ where: { cpf: { [Op.like]: `%${cpfLimpo}%` } } })
        if (cpfExiste) {
            return res.status(409).json({ erro: 'CPF já cadastrado.' })
        }

        // Hash da senha
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
        const senhaHash = await bcrypt.hash(senha, saltRounds)

        const novoUsuario = await Usuario.create({
            nome,
            email,
            senha: senhaHash,
            telefone,
            cpf: cpfLimpo,
            identidade: identidade || null,
            tipo_usuario: 'CLIENTE'
        })

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: {
                codUsuario: novoUsuario.codUsuario,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                tipo_usuario: novoUsuario.tipo_usuario
            }
        })

    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /usuarios — Listar todos (ADMIN)
// ──────────────────────────────────────────────────────────
async function listar(req, res) {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['senha'] },
            order: [['nome', 'ASC']]
        })
        return res.status(200).json(usuarios)
    } catch (err) {
        console.error('Erro ao listar usuários:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /usuarios/perfil — Perfil do usuário logado (PRIVADO)
// ──────────────────────────────────────────────────────────
async function perfil(req, res) {
    try {
        const usuario = await Usuario.findByPk(req.usuario.codUsuario, {
            attributes: { exclude: ['senha'] }
        })
        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' })
        return res.status(200).json(usuario)
    } catch (err) {
        console.error('Erro ao buscar perfil:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /usuarios/:id — Buscar por ID (ADMIN)
// ──────────────────────────────────────────────────────────
async function buscarPorId(req, res) {
    try {
        const { id } = req.params
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['senha'] }
        })
        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' })
        return res.status(200).json(usuario)
    } catch (err) {
        console.error('Erro ao buscar usuário:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// PUT /usuarios/:id — Atualizar completo (PRIVADO)
// ──────────────────────────────────────────────────────────
async function atualizar(req, res) {
    try {
        const { id } = req.params

        // Usuário só pode editar o próprio perfil (ou admin pode editar qualquer um)
        if (req.usuario.tipo_usuario !== 'ADMIN' && req.usuario.codUsuario !== parseInt(id)) {
            return res.status(403).json({ erro: 'Você não tem permissão para alterar este usuário.' })
        }

        const usuario = await Usuario.findByPk(id)
        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' })

        const { nome, email, senha, telefone, cpf, identidade } = req.body

        if (!nome || !email || !telefone) {
            return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, telefone.' })
        }

        // Valida CPF se fornecido
        if (cpf && !validarCPF(cpf)) {
            return res.status(400).json({ erro: 'CPF inválido.' })
        }

        const dadosAtualizados = { nome, email, telefone, identidade: identidade || null }

        if (cpf) dadosAtualizados.cpf = cpf.replace(/[^\d]/g, '')
        if (senha) {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
            dadosAtualizados.senha = await bcrypt.hash(senha, saltRounds)
        }

        await usuario.update(dadosAtualizados)

        return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso!' })

    } catch (err) {
        console.error('Erro ao atualizar usuário:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// PATCH /usuarios/:id — Atualizar parcialmente (PRIVADO)
// ──────────────────────────────────────────────────────────
async function atualizarParcial(req, res) {
    try {
        const { id } = req.params

        if (req.usuario.tipo_usuario !== 'ADMIN' && req.usuario.codUsuario !== parseInt(id)) {
            return res.status(403).json({ erro: 'Você não tem permissão para alterar este usuário.' })
        }

        const usuario = await Usuario.findByPk(id)
        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' })

        const campos = req.body
        if (campos.cpf && !validarCPF(campos.cpf)) {
            return res.status(400).json({ erro: 'CPF inválido.' })
        }
        if (campos.cpf) campos.cpf = campos.cpf.replace(/[^\d]/g, '')
        if (campos.senha) {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
            campos.senha = await bcrypt.hash(campos.senha, saltRounds)
        }

        await usuario.update(campos)
        return res.status(200).json({ mensagem: 'Usuário atualizado parcialmente com sucesso!' })

    } catch (err) {
        console.error('Erro ao atualizar parcialmente:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// DELETE /usuarios/:id — Deletar (ADMIN)
// ──────────────────────────────────────────────────────────
async function deletar(req, res) {
    try {
        const { id } = req.params
        const usuario = await Usuario.findByPk(id)
        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' })

        await usuario.destroy()
        return res.status(200).json({ mensagem: 'Usuário removido com sucesso.' })
    } catch (err) {
        console.error('Erro ao deletar usuário:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { cadastrar, listar, perfil, buscarPorId, atualizar, atualizarParcial, deletar }
