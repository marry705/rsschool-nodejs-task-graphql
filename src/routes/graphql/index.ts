import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
	graphql,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from 'graphql';
import { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { UserEntity } from '../../utils/DB/entities/DBUsers';
import { ErrorMessages } from '../../utils/response';
import { graphqlBodySchema } from './schema';
import { MemberType, Post, Profile, User } from './types';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.post(
		'/',
		{
			schema: {
				body: graphqlBodySchema,
			},
		},
		async function (request, reply) {
			console.log(' \n DCFVGYBHUNJK \n');

			const RootQuery = new GraphQLObjectType({
				name: 'Query',
				fields: {
					users: {
						type: new GraphQLList(User),
						async resolve(): Promise<UserEntity[]> {
							return await fastify.db.users.findMany();
						},
					},
					profiles: {
						type: new GraphQLList(Profile),
						async resolve(): Promise<ProfileEntity[]> {
							return await fastify.db.profiles.findMany();
						},
					},
					posts: {
						type: new GraphQLList(Post),
						async resolve(): Promise<PostEntity[]> {
							return await fastify.db.posts.findMany();
						},
					},
					memberTypes: {
						type: new GraphQLList(MemberType),
						async resolve(): Promise<MemberTypeEntity[]> {
							return await fastify.db.memberTypes.findMany();
						},
					},
					user: {
						type: User,
						args: {
							id: { type: new GraphQLNonNull(GraphQLString) },
						},
						async resolve(_, { id }): Promise<UserEntity> {
							const user = await fastify.db.users.findOne({
								key: 'id',
								equals: id,
							});

							if (!user) {
								throw fastify.httpErrors.notFound(ErrorMessages.USER_ERROR);
							}

							return user;
						},
					},
					profile: {
						type: Profile,
						args: {
							id: { type: new GraphQLNonNull(GraphQLString) },
						},
						async resolve(_, { id }): Promise<ProfileEntity> {
							const profile = await fastify.db.profiles.findOne({
								key: 'id',
								equals: id,
							});

							if (!profile) {
								throw fastify.httpErrors.notFound(ErrorMessages.PROFILE_ERROR);
							}

							return profile;
						},
					},
					post: {
						type: Post,
						args: {
							id: { type: new GraphQLNonNull(GraphQLString) },
						},
						async resolve(_, { id }): Promise<PostEntity> {
							const post = await fastify.db.posts.findOne({
								key: 'id',
								equals: id,
							});

							if (!post) {
								throw fastify.httpErrors.notFound(ErrorMessages.POST_ERROR);
							}

							return post;
						},
					},
					memberType: {
						type: MemberType,
						args: {
							id: { type: new GraphQLNonNull(GraphQLString) },
						},
						async resolve(_, { id }): Promise<MemberTypeEntity> {
							const memberType = await fastify.db.memberTypes.findOne({
								key: 'id',
								equals: id,
							});

							if (!memberType) {
								throw fastify.httpErrors.notFound(
									ErrorMessages.MEMBER_TYPE_ERROR
								);
							}

							return memberType;
						},
					},
				},
			});

			const RootMutation = new GraphQLObjectType({
				name: 'Mutation',
				fields: {
					createUser: {
						type: User,
						args: {
							firstName: { type: new GraphQLNonNull(GraphQLString) },
							lastName: { type: new GraphQLNonNull(GraphQLString) },
							email: { type: new GraphQLNonNull(GraphQLString) },
						},
						async resolve(
							_,
							{ firstName, lastName, email }: Omit<UserEntity, 'id'>
						) {
							return await fastify.db.users.create({
								firstName,
								lastName,
								email,
							});
						},
					},
					createPost: {
						type: Post,
						args: {
							title: { type: new GraphQLNonNull(GraphQLString) },
							content: { type: new GraphQLNonNull(GraphQLString) },
							userId: { type: new GraphQLNonNull(GraphQLID) },
						},
						async resolve(
							_,
							{ userId, title, content }: Omit<PostEntity, 'id'>
						) {
							const user = await fastify.db.users.findOne({
								key: 'id',
								equals: userId,
							});

							if (!user) {
								throw fastify.httpErrors.notFound(ErrorMessages.USER_ERROR);
							}

							const newPost = await fastify.db.posts.create({
								userId,
								title,
								content,
							});

							return reply.send(newPost);
						},
					},
				},
			});

			const schema: GraphQLSchema = new GraphQLSchema({
				query: RootQuery,
				mutation: RootMutation,
			});

			const { query, variables, mutation } = request.body;

			if (query) {
				if (variables) {
					const result = await graphql({
						schema,
						source: query,
						variableValues: variables,
					});

					return reply.send(result);
				}

				const result = await graphql({ schema, source: query });

				return reply.send(result);
			}

			if (mutation) {
				if (variables) {
					const result = await graphql({
						schema,
						source: mutation,
						variableValues: variables,
					});

					return reply.send(result);
				}

				const result = await graphql({ schema, source: mutation });

				return reply.send(result);
			}
		}
	);
};

export default plugin;
