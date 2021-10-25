import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
    id: string;
    name: string;
    login: string;
    avatar_url: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: () => void;
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProvider = {
    children: ReactNode;
}

type AuthResponde = {
    token: string,
    user: {
        id: string,
        avatar_url: string,
        name: string,
        login: string
    }
}

export function AuthProvider(props: AuthProvider) {

    const [user, setUser] = useState<User | null>(null);

    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=82fe96fa2f142ab95ae9`;

    async function signIn(githubCode: string) {
        const responde = await api.post<AuthResponde>("authenticate", {
            code: githubCode
        });

        const { token, user } = responde.data;

        localStorage.setItem('@dowhile:token', token);

        api.defaults.headers.common.authorization = `Bearer ${token}`;

        setUser(user);

    }

    function signOut() {
        setUser(null);
        localStorage.removeItem('@dowhile:token');
    }

    useEffect(() => {
        const token = localStorage.getItem('@dowhile:token');

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`;

            api.get<User>('profile').then((responde: any) => {
                setUser(responde.data);
            });
        }

    }, [])

    useEffect(() => {
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if (hasGithubCode) {
            const [urlWIthoutCode, githubCode] = url.split('?code=');
            window.history.pushState({}, '', urlWIthoutCode);

            signIn(githubCode);
        }

    }, [])

    return (
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {props.children}
        </AuthContext.Provider>
    );
}