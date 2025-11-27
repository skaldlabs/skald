import swaggerAutogen from 'swagger-autogen'

const doc = {
    info: {
        title: 'Skald API',
        description: 'API Documentation for Skald',
    },
    host: 'localhost:8080',
    schemes: ['http'],
}

const outputFile = '../public/openapi.json'
const endpointsFiles = ['./expressServer.ts']

// swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc)

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
    console.log('✅ OpenAPI spec generated successfully at ./public/openapi.json')
})
