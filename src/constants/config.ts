import argv from 'minimist'
//Lấy gtri moi truong
const options = argv(process.argv.slice(2))

export const isProduction = Boolean(options.production)
