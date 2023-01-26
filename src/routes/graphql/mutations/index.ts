import {
	GraphQLID,
	GraphQLInt,
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
	CreatePostDtoInput,
	CreateUserDtoInput,
	GraphQLMemberType,
	GraphQLPost,
	GraphQLProfile,
	GraphQLUser,
	SubscribeUserDtoInput,
	UnSubscribeUserDtoInput,
	UpdateMemberDtoInput,
	UpdatePostDtoInput,
	UpdateProfileDtoInput,
	UpdateUserDtoInput,
} from '../types';

export const RootMutation = new GraphQLObjectType({
	name: 'Mutation',
	fields: {
		createUser: {
			type: GraphQLUser,
			args: { input: { type: CreateUserDtoInput } },
			async resolve(
				_,
				{ input }: Record<'input', Omit<UserEntity, 'id'>>,
				context
			) {
				return await context.db.users.create(input);
			},
		},
		createPost: {
			type: GraphQLPost,
			args: { input: { type: CreatePostDtoInput } },
			async resolve(
				_,
				{ input }: Record<'input', Omit<PostEntity, 'id'>>,
				context
			) {
				const { userId, title, content } = input;

				const user = await context.db.users.findOne({
					key: 'id',
					equals: userId,
				});

				if (!user) {
					throw context.httpErrors.notFound(ErrorMessages.USER_ERROR);
				}

				const newPost = await context.db.posts.create({
					userId,
					title,
					content,
				});

				return newPost;
			},
		},
		createProfile: {
			type: GraphQLProfile,
			args: {
				userId: { type: new GraphQLNonNull(GraphQLID) },
				avatar: { type: new GraphQLNonNull(GraphQLString) },
				sex: { type: new GraphQLNonNull(GraphQLString) },
				birthday: { type: new GraphQLNonNull(GraphQLInt) },
				country: { type: new GraphQLNonNull(GraphQLString) },
				street: { type: new GraphQLNonNull(GraphQLString) },
				city: { type: new GraphQLNonNull(GraphQLString) },
				memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
			},
			async resolve(
				_,
				{
					userId,
					avatar,
					sex,
					birthday,
					country,
					street,
					city,
					memberTypeId,
				}: Omit<ProfileEntity, 'id'>,
				context
			) {
				const user = await context.db.users.findOne({
					key: 'id',
					equals: userId,
				});

				const memberTypes = ['basic', 'business'];

				const checkProfile = await context.db.profiles.findOne({
					key: 'userId',
					equals: userId,
				});

				if (!user) {
					throw context.httpErrors.notFound(ErrorMessages.USER_ERROR);
				}

				const newProfile = await context.db.profiles.create({
					userId,
					avatar,
					sex,
					birthday,
					country,
					street,
					city,
					memberTypeId,
				});

				if (
					!memberTypes.includes(newProfile.memberTypeId) ||
					checkProfile ||
					!newProfile.id
				) {
					return context.httpErrors.notFound(ErrorMessages.BAD_REQUEST);
				}

				return newProfile;
			},
		},
		updateUser: {
			type: GraphQLUser,
			args: { input: { type: UpdateUserDtoInput } },
			async resolve(_, { input }: Record<'input', UserEntity>, context) {
				try {
					const updatedUser = await context.db.users.change(input);

					return updatedUser;
				} catch (error) {
					return error;
				}
			},
		},
		updatePost: {
			type: GraphQLPost,
			args: { input: { type: UpdatePostDtoInput } },
			async resolve(_, { input }: Record<'input', PostEntity>, context) {
				try {
					const updatedPost = await context.db.posts.change(input);

					return updatedPost;
				} catch (error) {
					return error;
				}
			},
		},
		updateProfile: {
			type: GraphQLProfile,
			args: { input: { type: UpdateProfileDtoInput } },
			async resolve(_, { input }: Record<'input', ProfileEntity>, context) {
				try {
					const updatedProfile = await context.db.profiles.change(input);

					return updatedProfile;
				} catch (error) {
					return error;
				}
			},
		},
		updateMemberType: {
			type: GraphQLMemberType,
			args: { input: { type: UpdateMemberDtoInput } },
			async resolve(_, { input }: Record<'input', MemberTypeEntity>, context) {
				try {
					const newMember = await context.db.memberTypes.change(input);

					return newMember;
				} catch (error) {
					return error;
				}
			},
		},
		subscribeUser: {
			type: GraphQLUser,
			args: { input: { type: SubscribeUserDtoInput } },
			async resolve(
				_,
				{ input }: Record<'input', Pick<ProfileEntity, 'id' | 'userId'>>,
				context
			) {
				const { id, userId } = input;

				const subscriber = await context.db.users.findOne({
					key: 'id',
					equals: id,
				});

				const candidate = await context.db.users.findOne({
					key: 'id',
					equals: userId,
				});

				if (!subscriber || !candidate) {
					throw context.httpErrors.notFound(ErrorMessages.NOT_FOUND);
				}

				const followerIndex = subscriber.subscribedToUserIds.findIndex(
					(follower: string) => follower === userId
				);

				if (followerIndex != -1) {
					throw context.httpErrors.notFound(ErrorMessages.BAD_REQUEST);
				}

				const subscriberSubscribedToIds = [
					...subscriber.subscribedToUserIds,
					candidate.id,
				];

				const candidateSubscribedToUserIds = [
					...candidate.subscribedToUserIds,
					subscriber.id,
				];

				const updatedUser = await context.db.users.change(id, {
					subscribedToUserIds: subscriberSubscribedToIds,
				});

				await context.db.users.change(userId, {
					subscribedToUserIds: candidateSubscribedToUserIds,
				});

				return updatedUser;
			},
		},
		unSubscribeUser: {
			type: GraphQLUser,
			args: { input: { type: UnSubscribeUserDtoInput } },
			async resolve(
				_,
				{ input }: Record<'input', Pick<ProfileEntity, 'id' | 'userId'>>,
				context
			) {
				const { id, userId } = input;

				const unSubscriber = await context.db.users.findOne({
					key: 'id',
					equals: id,
				});

				const candidate = await context.db.users.findOne({
					key: 'id',
					equals: userId,
				});

				if (!unSubscriber || !candidate) {
					return context.httpErrors.notFound(ErrorMessages.NOT_FOUND);
				}

				const followerIndex = unSubscriber.subscribedToUserIds.findIndex(
					(follower: string) => follower === userId
				);

				const subscriberIndex = candidate.subscribedToUserIds.findIndex(
					(subscriber: string) => subscriber === id
				);

				if (followerIndex === -1 || subscriberIndex === -1) {
					return context.httpErrors.notFound(ErrorMessages.BAD_REQUEST);
				}

				const updatedUser = await context.db.users.change(id, {
					subscribedToUserIds: unSubscriber.subscribedToUserIds.filter(
						(follower: string) => follower != userId
					),
				});

				await context.db.users.change(userId, {
					subscribedToUserIds: candidate.subscribedToUserIds.filter(
						(subscriber: string) => subscriber != id
					),
				});

				return updatedUser;
			},
		},
	},
});
