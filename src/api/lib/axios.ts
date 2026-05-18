import axios from 'axios'

export const backendApi = axios.create({
  baseURL: 'http://',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const llmApi = axios.create({
  baseURL: 'http://',
  headers: {
    'Content-Type': 'application/json'
  }
})

// backendApi.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken')
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// backendApi.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response.status === 401) {
//       localStorage.removeItem('accessToken')
//     }
//     return Promise.reject(error)
//   }
// )

