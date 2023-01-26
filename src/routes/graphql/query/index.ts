import {
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
} from 'graphql';
import { MemberTypeEntity } from '../../../utils/DB/entities/DBMemberTypes';
import { PostEntity } from '../../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';
import { ErrorMessages } from '../../../utils/response';
import {
	GraphQLMemberType,
	GraphQLPost,
	GraphQLProfile,
	GraphQLUser,
} from '../types';

export const RootQuery = new GraphQLObjectType({
	name: 'Query',
	fields: {
		users: {
			type: new GraphQLList(GraphQLUser),
			async resolve(_, _, context): Promise<UserEntity[]> {
				return await context.db.users.findMany();
			},
		},
		profiles: {
			type: new GraphQLList(GraphQLProfile),
			async resolve(_, _, context): Promise<ProfileEntity[]> {
				return await context.db.profiles.findMany();
			},
		},
		posts: {
			type: new GraphQLList(GraphQLPost),
			async resolve(_, _, context): Promise<PostEntity[]> {
				return await context.db.posts.findMany();
			},
		},
		memberTypes: {
			type: new GraphQLList(GraphQLMemberType),
			async resolve(_, _, context): Promise<MemberTypeEntity[]> {
				return await context.db.memberTypes.findMany();
			},
		},
		user: {
			type: GraphQLUser,
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
			},
			async resolve(_, { id }, context): Promise<UserEntity> {
				const user = await context.db.users.findOne({
					key: 'id',
					equals: id,
				});

				if (!user) {
					throw context.httpErrors.notFound(ErrorMessages.USER_ERROR);
				}

				return user;
			},
		},
		profile: {
			type: GraphQLProfile,
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
			},
			async resolve(_, { id }, context): Promise<ProfileEntity> {
				const profile = await context.db.profiles.findOne({
					key: 'id',
					equals: id,
				});

				if (!profile) {
					throw context.httpErrors.notFound(ErrorMessages.PROFILE_ERROR);
				}

				return profile;
			},
		},
		post: {
			type: GraphQLPost,
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
			},
			async resolve(_, { id }, context): Promise<PostEntity> {
				const post = await context.db.posts.findOne({
					key: 'id',
					equals: id,
				});

				if (!post) {
					throw context.httpErrors.notFound(ErrorMessages.POST_ERROR);
				}

				return post;
			},
		},
		memberType: {
			type: GraphQLMemberType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
			},
			async resolve(_, { id }, context): Promise<MemberTypeEntity> {
				const memberType = await context.db.memberTypes.findOne({
					key: 'id',
					equals: id,
				});

				if (!memberType) {
					throw context.httpErrors.notFound(ErrorMessages.MEMBER_TYPE_ERROR);
				}

				return memberType;
			},
		},
	},
});
