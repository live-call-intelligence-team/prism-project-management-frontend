import apiClient from '../client';

export interface Comment {
    id: string;
    issueId: string;
    userId: string;
    content: string;
    mentions: string[];
    isClientVisible: boolean;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        avatar?: string;
    };
}

export const commentsApi = {
    // Get comments for an issue
    getIssueComments: async (issueId: string): Promise<Comment[]> => {
        const response = await apiClient.get<{ success: boolean; data: { comments: Comment[] } }>(
            `/issues/${issueId}/comments`
        );
        return response.data.data.comments || [];
    },

    // Create a new comment
    create: async (issueId: string, content: string, mentions?: string[]): Promise<Comment> => {
        const response = await apiClient.post<{ success: boolean; data: { comment: Comment } }>(
            `/issues/${issueId}/comments`,
            { content, mentions }
        );
        return response.data.data.comment;
    },

    // Update a comment
    update: async (commentId: string, content: string): Promise<Comment> => {
        const response = await apiClient.put<{ success: boolean; data: { comment: Comment } }>(
            `/comments/${commentId}`,
            { content }
        );
        return response.data.data.comment;
    },

    // Delete a comment
    delete: async (commentId: string): Promise<void> => {
        await apiClient.delete(`/comments/${commentId}`);
    },
};
