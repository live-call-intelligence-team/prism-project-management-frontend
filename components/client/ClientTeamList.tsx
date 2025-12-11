'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Mail, Shield } from 'lucide-react';

interface ClientTeamListProps {
    projectId: string;
}

interface TeamMember {
    id: string;
    userId: string;
    role: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
    };
}

export function ClientTeamList({ projectId }: ClientTeamListProps) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await projectsApi.getMembers(projectId);
                setMembers(data);
            } catch (error) {
                console.error("Failed to fetch team members", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchMembers();
        }
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No team members found for this project.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={member.user.avatarUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {member.user.firstName[0]}{member.user.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base truncate">
                                {member.user.firstName} {member.user.lastName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {member.role}
                                </Badge>
                                <span className="flex h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" title="Online" />
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{member.user.email}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
