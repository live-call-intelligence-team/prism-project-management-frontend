'use client';

import { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

interface UserOption {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface MultiUserSelectProps {
    users: UserOption[];
    value: string[];
    onChange: (value: string[]) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export default function MultiUserSelect({
    users,
    value,
    onChange,
    label,
    placeholder = 'Select users...',
    disabled = false,
    className
}: MultiUserSelectProps) {
    const [query, setQuery] = useState('');

    const selectedUsers = users.filter((user) => value.includes(user.id));

    const filteredUsers =
        query === ''
            ? users
            : users.filter((user) => {
                return (
                    user.name.toLowerCase().includes(query.toLowerCase()) ||
                    user.email.toLowerCase().includes(query.toLowerCase())
                );
            });

    const toggleUser = (userId: string) => {
        if (value.includes(userId)) {
            onChange(value.filter((id) => id !== userId));
        } else {
            onChange([...value, userId]);
        }
    };

    const removeUser = (userId: string) => {
        onChange(value.filter((id) => id !== userId));
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}

            {/* Selected Tags */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedUsers.map((user) => (
                        <span
                            key={user.id}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                        >
                            {user.name}
                            <button
                                type="button"
                                onClick={() => removeUser(user.id)}
                                className="ml-1 text-primary-600 hover:text-primary-800 focus:outline-none"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <Combobox value={value} onChange={() => { }} disabled={disabled} multiple>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0"
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                            {filteredUsers.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-400">
                                    Nothing found.
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <Combobox.Option
                                        key={user.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'
                                            }`
                                        }
                                        value={user.id}
                                        onClick={() => toggleUser(user.id)} // Custom toggle logic
                                    >
                                        {({ active }) => {
                                            const selected = value.includes(user.id);
                                            return (
                                                <>
                                                    <div className="flex items-center">
                                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 ${active ? 'bg-primary-200' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                            <span className="text-xs font-medium">
                                                                {user.name?.charAt(0) || user.email.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                                                        >
                                                            {user.name} <span className="text-xs opacity-70">({user.email})</span>
                                                        </span>
                                                    </div>
                                                    {selected ? (
                                                        <span
                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-primary-600' : 'text-primary-600'
                                                                }`}
                                                        >
                                                            <Check className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )
                                        }}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}
