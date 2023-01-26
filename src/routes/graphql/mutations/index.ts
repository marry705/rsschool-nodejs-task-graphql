import {
	GraphQLID,
	GraphQLInt,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
} from 'graphql';
import { PostEntity } from '../../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';
import { ErrorMessages } from '../../../utils/response';
import { CreateUserDtoInput, GraphQLPost, GraphQLProfile, GraphQLUser, UpdateUserDtoInput } from '../types';

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
                const { firstName, lastName, email } = input;

				return await context.db.users.create({
					firstName,
					lastName,
					email,
				});
			},
		},
		createPost: {
			type: GraphQLPost,
			args: {
				title: { type: new GraphQLNonNull(GraphQLString) },
				content: { type: new GraphQLNonNull(GraphQLString) },
				userId: { type: new GraphQLNonNull(GraphQLID) },
			},
			async resolve(
				_,
				{ userId, title, content }: Omit<PostEntity, 'id'>,
				context
			) {
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
				{ userId, avatar, sex, birthday, country, street, city, memberTypeId }: Omit<ProfileEntity, 'id'>,
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
                    memberTypeId
				});

                if (!memberTypes.includes(newProfile.memberTypeId)
                    || checkProfile
                    || !newProfile.id
                ) {
                    return context.httpErrors.notFound(ErrorMessages.BAD_REQUEST);
                }

				return newProfile;
			},
        },
        updateUser: {
            type: GraphQLUser,
            args: { input: {type: UpdateUserDtoInput } },
            async resolve(
				_,
				{ input }: Record<'input', UserEntity>,
				context
			) {
                try {
                    const { id, firstName, lastName, email } = input;

                    const updatedUser = await context.db.users.change(
                        id,
                        firstName,
                        lastName,
                        email
                    );

                    return updatedUser;
                } catch (error) {

                    return error;
                }
           }
        }
	},
});
