import apiClient from '../client';

export interface CommentAttachment {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    fileUrl: string;
    createdAt: string;
}

export interface Comment {
    id: string;
    issueId: string;
    userId: string;
    content: string;
    mentions: string[];
    isClientVisible: boolean;
    createdAt: string;
    updatedAt: string;
    attachments?: CommentAttachment[];
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
    // Get comments for an issue (now includes attachments)
    getIssueComments: async (issueId: string): Promise<Comment[]> => {
        const response = await apiClient.get<{ success: boolean; data: { comments: Comment[] } }>(
            `/issues/${issueId}/comments`
        );
        return response.data.data.comments || [];
    },

    // Create a new comment with optional file attachments
    create: async (
        issueId: string,
        content: string,
        mentionIds?: string[],
        files?: File[]
    ): Promise<Comment> => {
        const formData = new FormData();
        formData.append('content', content);

        if (mentionIds && mentionIds.length > 0) {
            formData.append('mentionIds', JSON.stringify(mentionIds));
        }

        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('files', file);
            });
        }

        const response = await apiClient.post<{ success: boolean; data: { comment: Comment } }>(
            `/issues/${issueId}/comments`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
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
