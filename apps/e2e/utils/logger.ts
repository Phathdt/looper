import preset, { LogLevel } from '@config/test.config'

import pino from 'pino'

const format = process.env.LOG_FORMAT ?? 'pretty'
const level = (process.env.LOG_LEVEL as LogLevel) ?? preset.logLevel

export const logger = pino({
  level,
  ...(format === 'pretty'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: true,
          },
        },
      }
    : {}),
})
