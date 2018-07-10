require('dotenv').config()
const request = require("request")
const opn = require('opn')


const getOptions = (url, body, token, method = 'POST') => ({
  url: `https://${process.env.DOMAIN}${url}`,
  method,
  headers: token ?
    {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    } :
    {
      'Content-Type': 'application/json',
    },
  body,
})

const options = getOptions(
  '/oauth/token',
  `{"client_id":"${process.env.CLIENT_ID}","client_secret":"${process.env.CLIENT_SECRET}","audience":"https://${process.env.DOMAIN}/api/v2/","grant_type":"client_credentials"}`
)

request(options, function (error, response, body) {
  if (error) throw new Error(error)
  const token = JSON.parse(body).access_token
  console.log('Succesfully authenticated.')
  createJob(token)
})

const createJob = token => {
  const options = getOptions(
    '/api/v2/jobs/users-exports',
    '{"format":"csv","fields":[{"name":"email"},{"name":"user_metadata.newsletter"},{"name":"user_metadata.fourThreeMailingList.given"},{"name":"email_verified"}]}',
    token,
  )
  console.log('Creating export job.')

  request(options, function(error, response, body) {
    if (error) throw new Error(error)
    const jobId = JSON.parse(body).id

    console.log(`Job created. id: ${jobId}`)
    getJob(token, jobId)
  })
}

const getJob = (token, jobId) => {
  const options = getOptions('/api/v2/jobs/' + jobId, null, token, 'GET')

  request(options, function(error, response, body) {
    if (error) throw new Error(error)
    const {location} = JSON.parse(body)

    if (location) {
      console.log('Complete!')
      console.log(location)
      opn(location)
    } else {
      console.log('Pending...')
      setTimeout(() => getJob(token, jobId), 5000)
    }
  })
}
