import type { AdminUserItem, UserData, UserStatus } from '../../types/user'
import { db, ME_ID, now } from '../db'
import { cursorPage, del, fail, get, ok, patch, type MockRoute } from '../server'

const findUser = (userId: string) => db.users.find((user) => user.user_id === userId)

const notFound = () => fail(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.')

const toListItem = ({ user_id, name, email, role, status, created_at }: UserData): AdminUserItem =>
  ({ user_id, name, email, role, status, created_at })

const setStatus = (userId: string, status: UserStatus) => {
  const user = findUser(userId)
  if (!user) return notFound()
  Object.assign(user, { status, updated_at: now() })
  return ok(user)
}

export const userRoutes: MockRoute[] = [
  get('/users/me', () => {
    const { name, email, role, created_at } = findUser(ME_ID)!
    return ok({ name, email, role, created_at })
  }),

  get('/admin/users', ({ query }) => {
    const role = query.get('role')
    const status = query.get('status')
    const search = query.get('search') ?? ''
    const users = db.users.filter((user) =>
      (!role || user.role === role) &&
      (!status || user.status === status) &&
      (user.name.includes(search) || user.email.includes(search)))
    return ok(cursorPage(users.map(toListItem), query))
  }),

  get('/admin/users/:userId', ({ params }) => {
    const user = findUser(params.userId)
    return user ? ok(user) : notFound()
  }),

  patch('/admin/users/:userId/approve', ({ params }) => setStatus(params.userId, 'approved')),
  patch('/admin/users/:userId/reject', ({ params }) => setStatus(params.userId, 'rejected')),

  del('/admin/users/:userId', ({ params }) => {
    const index = db.users.findIndex((user) => user.user_id === params.userId)
    if (index < 0) return notFound()
    db.users.splice(index, 1)
    return ok(null)
  }),
]
