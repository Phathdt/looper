export const URLS = {
  APP: process.env.APP_URL ?? 'http://localhost:5173',
  API: process.env.API_URL ?? 'http://localhost:4000/graphql',
  ROUTES: {
    LOGIN: '/login',
    REGISTER: '/register',
    FEED: '/',
    CREATE: '/create',
    USER: (id: string) => `/user/${id}`,
  },
}

export const getAppUrl = (route: string): string => `${URLS.APP}${route}`

export const getTestCredentials = () => ({
  email: process.env.TEST_EMAIL ?? 'alice@looper.dev',
  password: process.env.TEST_PASSWORD ?? 'password123',
})
