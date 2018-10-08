module.exports = {
        typeDefs: /* GraphQL */ `type AggregateRespondent {
  count: Int!
}

type AggregateShow {
  count: Int!
}

type AggregateUser {
  count: Int!
}

type BatchPayload {
  count: Long!
}

scalar DateTime

scalar Long

type Mutation {
  createRespondent(data: RespondentCreateInput!): Respondent!
  updateRespondent(data: RespondentUpdateInput!, where: RespondentWhereUniqueInput!): Respondent
  updateManyRespondents(data: RespondentUpdateInput!, where: RespondentWhereInput): BatchPayload!
  upsertRespondent(where: RespondentWhereUniqueInput!, create: RespondentCreateInput!, update: RespondentUpdateInput!): Respondent!
  deleteRespondent(where: RespondentWhereUniqueInput!): Respondent
  deleteManyRespondents(where: RespondentWhereInput): BatchPayload!
  createShow(data: ShowCreateInput!): Show!
  updateShow(data: ShowUpdateInput!, where: ShowWhereUniqueInput!): Show
  updateManyShows(data: ShowUpdateInput!, where: ShowWhereInput): BatchPayload!
  upsertShow(where: ShowWhereUniqueInput!, create: ShowCreateInput!, update: ShowUpdateInput!): Show!
  deleteShow(where: ShowWhereUniqueInput!): Show
  deleteManyShows(where: ShowWhereInput): BatchPayload!
  createUser(data: UserCreateInput!): User!
  updateUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  updateManyUsers(data: UserUpdateInput!, where: UserWhereInput): BatchPayload!
  upsertUser(where: UserWhereUniqueInput!, create: UserCreateInput!, update: UserUpdateInput!): User!
  deleteUser(where: UserWhereUniqueInput!): User
  deleteManyUsers(where: UserWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  respondent(where: RespondentWhereUniqueInput!): Respondent
  respondents(where: RespondentWhereInput, orderBy: RespondentOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Respondent]!
  respondentsConnection(where: RespondentWhereInput, orderBy: RespondentOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): RespondentConnection!
  show(where: ShowWhereUniqueInput!): Show
  shows(where: ShowWhereInput, orderBy: ShowOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Show]!
  showsConnection(where: ShowWhereInput, orderBy: ShowOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ShowConnection!
  user(where: UserWhereUniqueInput!): User
  users(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [User]!
  usersConnection(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserConnection!
  node(id: ID!): Node
}

type Respondent {
  id: ID!
  anonymousName: String
  user: User
  role: String!
  response: [DateTime!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type RespondentConnection {
  pageInfo: PageInfo!
  edges: [RespondentEdge]!
  aggregate: AggregateRespondent!
}

input RespondentCreateInput {
  anonymousName: String
  user: UserCreateOneInput
  role: String
  response: RespondentCreateresponseInput
}

input RespondentCreateManyInput {
  create: [RespondentCreateInput!]
  connect: [RespondentWhereUniqueInput!]
}

input RespondentCreateresponseInput {
  set: [DateTime!]
}

type RespondentEdge {
  node: Respondent!
  cursor: String!
}

enum RespondentOrderByInput {
  id_ASC
  id_DESC
  anonymousName_ASC
  anonymousName_DESC
  role_ASC
  role_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type RespondentPreviousValues {
  id: ID!
  anonymousName: String
  role: String!
  response: [DateTime!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type RespondentSubscriptionPayload {
  mutation: MutationType!
  node: Respondent
  updatedFields: [String!]
  previousValues: RespondentPreviousValues
}

input RespondentSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: RespondentWhereInput
  AND: [RespondentSubscriptionWhereInput!]
  OR: [RespondentSubscriptionWhereInput!]
  NOT: [RespondentSubscriptionWhereInput!]
}

input RespondentUpdateDataInput {
  anonymousName: String
  user: UserUpdateOneInput
  role: String
  response: RespondentUpdateresponseInput
}

input RespondentUpdateInput {
  anonymousName: String
  user: UserUpdateOneInput
  role: String
  response: RespondentUpdateresponseInput
}

input RespondentUpdateManyInput {
  create: [RespondentCreateInput!]
  delete: [RespondentWhereUniqueInput!]
  connect: [RespondentWhereUniqueInput!]
  disconnect: [RespondentWhereUniqueInput!]
  update: [RespondentUpdateWithWhereUniqueNestedInput!]
  upsert: [RespondentUpsertWithWhereUniqueNestedInput!]
}

input RespondentUpdateresponseInput {
  set: [DateTime!]
}

input RespondentUpdateWithWhereUniqueNestedInput {
  where: RespondentWhereUniqueInput!
  data: RespondentUpdateDataInput!
}

input RespondentUpsertWithWhereUniqueNestedInput {
  where: RespondentWhereUniqueInput!
  update: RespondentUpdateDataInput!
  create: RespondentCreateInput!
}

input RespondentWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  anonymousName: String
  anonymousName_not: String
  anonymousName_in: [String!]
  anonymousName_not_in: [String!]
  anonymousName_lt: String
  anonymousName_lte: String
  anonymousName_gt: String
  anonymousName_gte: String
  anonymousName_contains: String
  anonymousName_not_contains: String
  anonymousName_starts_with: String
  anonymousName_not_starts_with: String
  anonymousName_ends_with: String
  anonymousName_not_ends_with: String
  user: UserWhereInput
  role: String
  role_not: String
  role_in: [String!]
  role_not_in: [String!]
  role_lt: String
  role_lte: String
  role_gt: String
  role_gte: String
  role_contains: String
  role_not_contains: String
  role_starts_with: String
  role_not_starts_with: String
  role_ends_with: String
  role_not_ends_with: String
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [RespondentWhereInput!]
  OR: [RespondentWhereInput!]
  NOT: [RespondentWhereInput!]
}

input RespondentWhereUniqueInput {
  id: ID
}

type Show {
  id: ID!
  slug: String!
  name: String!
  isPrivate: Boolean!
  isAnonymous: Boolean!
  isReadOnly: Boolean!
  isCreatedAnonymously: Boolean!
  startDate: DateTime!
  endDate: DateTime!
  interval: Int!
  respondents(where: RespondentWhereInput, orderBy: RespondentOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Respondent!]
  createdAt: DateTime!
}

type ShowConnection {
  pageInfo: PageInfo!
  edges: [ShowEdge]!
  aggregate: AggregateShow!
}

input ShowCreateInput {
  slug: String!
  name: String!
  isPrivate: Boolean
  isAnonymous: Boolean
  isReadOnly: Boolean
  isCreatedAnonymously: Boolean
  startDate: DateTime!
  endDate: DateTime!
  interval: Int!
  respondents: RespondentCreateManyInput
}

type ShowEdge {
  node: Show!
  cursor: String!
}

enum ShowOrderByInput {
  id_ASC
  id_DESC
  slug_ASC
  slug_DESC
  name_ASC
  name_DESC
  isPrivate_ASC
  isPrivate_DESC
  isAnonymous_ASC
  isAnonymous_DESC
  isReadOnly_ASC
  isReadOnly_DESC
  isCreatedAnonymously_ASC
  isCreatedAnonymously_DESC
  startDate_ASC
  startDate_DESC
  endDate_ASC
  endDate_DESC
  interval_ASC
  interval_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ShowPreviousValues {
  id: ID!
  slug: String!
  name: String!
  isPrivate: Boolean!
  isAnonymous: Boolean!
  isReadOnly: Boolean!
  isCreatedAnonymously: Boolean!
  startDate: DateTime!
  endDate: DateTime!
  interval: Int!
  createdAt: DateTime!
}

type ShowSubscriptionPayload {
  mutation: MutationType!
  node: Show
  updatedFields: [String!]
  previousValues: ShowPreviousValues
}

input ShowSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ShowWhereInput
  AND: [ShowSubscriptionWhereInput!]
  OR: [ShowSubscriptionWhereInput!]
  NOT: [ShowSubscriptionWhereInput!]
}

input ShowUpdateInput {
  slug: String
  name: String
  isPrivate: Boolean
  isAnonymous: Boolean
  isReadOnly: Boolean
  isCreatedAnonymously: Boolean
  startDate: DateTime
  endDate: DateTime
  interval: Int
  respondents: RespondentUpdateManyInput
}

input ShowWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  slug: String
  slug_not: String
  slug_in: [String!]
  slug_not_in: [String!]
  slug_lt: String
  slug_lte: String
  slug_gt: String
  slug_gte: String
  slug_contains: String
  slug_not_contains: String
  slug_starts_with: String
  slug_not_starts_with: String
  slug_ends_with: String
  slug_not_ends_with: String
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  isPrivate: Boolean
  isPrivate_not: Boolean
  isAnonymous: Boolean
  isAnonymous_not: Boolean
  isReadOnly: Boolean
  isReadOnly_not: Boolean
  isCreatedAnonymously: Boolean
  isCreatedAnonymously_not: Boolean
  startDate: DateTime
  startDate_not: DateTime
  startDate_in: [DateTime!]
  startDate_not_in: [DateTime!]
  startDate_lt: DateTime
  startDate_lte: DateTime
  startDate_gt: DateTime
  startDate_gte: DateTime
  endDate: DateTime
  endDate_not: DateTime
  endDate_in: [DateTime!]
  endDate_not_in: [DateTime!]
  endDate_lt: DateTime
  endDate_lte: DateTime
  endDate_gt: DateTime
  endDate_gte: DateTime
  interval: Int
  interval_not: Int
  interval_in: [Int!]
  interval_not_in: [Int!]
  interval_lt: Int
  interval_lte: Int
  interval_gt: Int
  interval_gte: Int
  respondents_every: RespondentWhereInput
  respondents_some: RespondentWhereInput
  respondents_none: RespondentWhereInput
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  AND: [ShowWhereInput!]
  OR: [ShowWhereInput!]
  NOT: [ShowWhereInput!]
}

input ShowWhereUniqueInput {
  id: ID
  slug: String
}

type Subscription {
  respondent(where: RespondentSubscriptionWhereInput): RespondentSubscriptionPayload
  show(where: ShowSubscriptionWhereInput): ShowSubscriptionPayload
  user(where: UserSubscriptionWhereInput): UserSubscriptionPayload
}

type User {
  id: ID!
  uid: String!
  email: String!
  name: String!
  isPremium: Boolean!
  createdAt: DateTime!
}

type UserConnection {
  pageInfo: PageInfo!
  edges: [UserEdge]!
  aggregate: AggregateUser!
}

input UserCreateInput {
  uid: String!
  email: String!
  name: String!
  isPremium: Boolean
}

input UserCreateOneInput {
  create: UserCreateInput
  connect: UserWhereUniqueInput
}

type UserEdge {
  node: User!
  cursor: String!
}

enum UserOrderByInput {
  id_ASC
  id_DESC
  uid_ASC
  uid_DESC
  email_ASC
  email_DESC
  name_ASC
  name_DESC
  isPremium_ASC
  isPremium_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UserPreviousValues {
  id: ID!
  uid: String!
  email: String!
  name: String!
  isPremium: Boolean!
  createdAt: DateTime!
}

type UserSubscriptionPayload {
  mutation: MutationType!
  node: User
  updatedFields: [String!]
  previousValues: UserPreviousValues
}

input UserSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: UserWhereInput
  AND: [UserSubscriptionWhereInput!]
  OR: [UserSubscriptionWhereInput!]
  NOT: [UserSubscriptionWhereInput!]
}

input UserUpdateDataInput {
  uid: String
  email: String
  name: String
  isPremium: Boolean
}

input UserUpdateInput {
  uid: String
  email: String
  name: String
  isPremium: Boolean
}

input UserUpdateOneInput {
  create: UserCreateInput
  update: UserUpdateDataInput
  upsert: UserUpsertNestedInput
  delete: Boolean
  disconnect: Boolean
  connect: UserWhereUniqueInput
}

input UserUpsertNestedInput {
  update: UserUpdateDataInput!
  create: UserCreateInput!
}

input UserWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  uid: String
  uid_not: String
  uid_in: [String!]
  uid_not_in: [String!]
  uid_lt: String
  uid_lte: String
  uid_gt: String
  uid_gte: String
  uid_contains: String
  uid_not_contains: String
  uid_starts_with: String
  uid_not_starts_with: String
  uid_ends_with: String
  uid_not_ends_with: String
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  isPremium: Boolean
  isPremium_not: Boolean
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  AND: [UserWhereInput!]
  OR: [UserWhereInput!]
  NOT: [UserWhereInput!]
}

input UserWhereUniqueInput {
  id: ID
  uid: String
  email: String
}
`
      }
    