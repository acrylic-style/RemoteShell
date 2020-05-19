const Discord = require('discord.js')
const client = new Discord.Client()
const { LoggerFactory } = require('logger.js')
const logger = LoggerFactory.getLogger('main', 'purple')
const env = require('dotenv-safe').config().parsed
env.ALLOWED_USERS = env.ALLOWED_USERS.split(/,/g)
const cp = require('child_process')

const split = m => {
  if (m.length <= 2000) return [m]
  return m.match(/[^]{1,1900}/g)
}

const codeblock = s => '```' + s.replace(/```/g, '\`\`\`') + '```'

client.on('ready', () => {
  logger.info('Bot is ready!')
})

const parse = s => {
  if (/rs:\/\/(.*):(\n|)([^]*)/.test(s)) {
    const r = /rs:\/\/(.*):(\n|)([^]*)/.exec(s)
    return {
      cwd: r[1],
      command: r[3],
    }
  } else if (/rs:\/\/(\n|)([^]*)/.test(s)) {
    const r = /rs:\/\/(\n|)([^]*)/.exec(s)
    return {
      cwd: '.',
      command: r[2],
    }
  }
}

client.on('message', async msg => {
  if (env.ALLOWED_USERS.includes(msg.author.id)) {
    if (msg.content.startsWith('rs://')) {
      const parsed = parse(msg.content)
      const command = parsed.command.replace(/^```\n([^]*)\n```$/, '$1')
      if (command === 'help') {
        msg.channel.send(`
使い方:
・\`rs://コマンド\` => コマンドを実行します。(cwdはindex.jsが動いているディレクトリ)
・\`rs://(cwd):コマンド\` => 指定したcwdでコマンドを実行します。
もしくは：
  rs://
  \\\`\\\`\\\`
  コマンド1
  コマンド2
  \\\`\\\`\\\`
`)
        return
      }
      msg.channel.send(`Command Line: \`\`\`sh\n${command}\n\`\`\``)
      const s = cp.spawn(command, { cwd: parsed.cwd, windowsHide: true, encoding: 'utf-8', shell: true })
      let messages = []
      s.stdout.on('data', data => messages.push(data.toString().replace(/(.*)/, '$1')))
      s.stderr.on('data', data => messages.push(data.toString().replace(/(.*)/, '$1')))
      const i = setInterval(() => {
        split(messages.join('\n')).forEach(s => msg.channel.send(codeblock(s)))
        messages.length = 0
      }, 1000)
      s.once('exit', () => {
        split(messages.join('\n')).forEach(s => msg.channel.send(codeblock(s)))
        messages.length = 0
        clearInterval(i)
      })
    }
  }
})

client.login(env.TOKEN)
