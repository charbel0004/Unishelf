import React, { useState, useEffect } from 'react';
import './css/UserManagementPage.css';
import config from './config';

interface User {
    encryptedUserID: string;
    userName: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    isCustomer: boolean;
    isEmployee: boolean;
    isManager: boolean;
    active: boolean;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    useEffect(() => {
        fetch(`${config.API_URL}/api/UserManagement/GetUsers`)
            .then(res => res.json())
            .then(data => setUsers(data));
    }, []);

    useEffect(() => {
        const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
        const results = users.filter(user => {
            return searchWords.every(word =>
                user.userName.toLowerCase().includes(word) ||
                user.firstName.toLowerCase().includes(word) ||
                user.lastName.toLowerCase().includes(word) ||
                user.emailAddress.toLowerCase().includes(word)
            );
        });
        setFilteredUsers(results);
    }, [searchTerm, users]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };


    // Function to handle toggle change and send API request
    const handleToggleChange = async (encryptedUserId: string, fieldName: string, value: boolean) => {
        try {
            const response = await fetch(
                `${config.API_URL}/api/UserManagement/UpdateUserField?encryptedUserId=${encryptedUserId}&fieldName=${fieldName}&value=${value}`,
                { method: 'POST' }
            );

            if (response.ok) {
                // Update the users state after successful update
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.encryptedUserID === encryptedUserId
                            ? { ...user, [fieldName]: value }
                            : user
                    )
                );
            } else {
                alert('Failed to update field.');
            }
        } catch (error) {
            console.error('Error updating user field:', error);
            alert('An error occurred while updating the field.');
        }
    };

    return (
        <div className="container-users">
            <div className="p-4">
                <h1 className="title">User List</h1>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>

                <div className="add-user">


                </div>
                

                <table className="usersTable">
                    <thead className="usersThead">
                        <tr>
                            <th>User Name</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Customer</th>
                            <th>Employee</th>
                            <th>Manager</th>
                            <th>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.encryptedUserID}>
                                <td className="user-td">{user.userName}</td>
                                <td className="user-td">{user.firstName} {user.lastName}</td>
                                <td className="user-td">{user.emailAddress}</td>
                                <td className="user-td">
                                    <label className="usersswitch">
                                        <input
                                            type="checkbox"
                                            checked={user.isCustomer}
                                            onChange={() =>
                                                handleToggleChange(user.encryptedUserID, 'isCustomer', !user.isCustomer)
                                            }
                                        />
                                        <span className="userslider"></span>
                                    </label>
                                </td>
                                <td className="user-td">
                                    <label className="usersswitch">
                                        <input
                                            type="checkbox"
                                            checked={user.isEmployee}
                                            onChange={() =>
                                                handleToggleChange(user.encryptedUserID, 'isEmployee', !user.isEmployee)
                                            }
                                        />
                                        <span className="userslider"></span>
                                    </label>
                                </td>
                                <td className="user-td">
                                    <label className="usersswitch">
                                        <input
                                            type="checkbox"
                                            checked={user.isManager}
                                            onChange={() =>
                                                handleToggleChange(user.encryptedUserID, 'isManager', !user.isManager)
                                            }
                                        />
                                        <span className="userslider"></span>
                                    </label>
                                </td>
                                <td className="user-td">
                                    <label className="usersswitch">
                                        <input
                                            type="checkbox"
                                            checked={user.active}
                                            onChange={() =>
                                                handleToggleChange(user.encryptedUserID, 'active', !user.active)
                                            }
                                        />
                                        <span className="userslider"></span>
                                    </label>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && searchTerm && (
                            <tr>
                                <td colSpan={7} className="no-results">No users found matching your search.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;  