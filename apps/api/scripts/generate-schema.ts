import { NestFactory } from '@nestjs/core'

import { AppModule } from '../src/app.module'

/**
 * Script to generate GraphQL schema without running the server
 * This is useful for CI/CD pipelines
 */
async function generateSchema() {
  console.log('🚀 Initializing NestJS application...')

  try {
    // Create the NestJS application instance
    // This will trigger the GraphQL module initialization and schema generation
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'], // Minimal logging
    })

    // Initialize the app (this triggers all module initializations)
    await app.init()

    console.log(
      '✅ GraphQL schema generated successfully at: graphql/schema.gql',
    )

    // Close the application
    await app.close()

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to generate GraphQL schema:', error)
    process.exit(1)
  }
}

generateSchema()
