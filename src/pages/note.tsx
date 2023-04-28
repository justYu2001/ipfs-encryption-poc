import type { FormEvent } from "react";

import type { NextPage } from "next";

import { useForm } from "react-hook-form";
import { getQueryKey } from "@trpc/react-query";
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

import { api } from "@/utils/api";

const NoteListPage: NextPage = () => {
    return (
        <>
            <NoteForm />
            <div className="mt-4">
                <button
                    className="bg-sky-400 p-2 text-white"
                    onClick={() => location.reload()}
                >
                    重新載入
                </button>
                <h2>你上傳的檔案：</h2>
            </div>
            <NoteList />
        </>
    );
};

export default NoteListPage;

const NoteList = () => {
    console.log(getQueryKey(api.note));
    const { data: notes, isLoading, isError } = api.note.fetchNotes.useQuery();

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (isError) {
        return <p>Error!</p>;
    }

    return (
        <ul>
            {notes.map(({ id, fileExtension }) => (
                <li key={id}>
                    <a href={`/api/notes/${id}`} download={`${id}.${fileExtension}`}>
                        {id}
                    </a>
                </li>
            ))}
        </ul>
    );
};

interface NewNote {
    files: FileList;
}

const NoteForm = () => {
    const { register, handleSubmit } = useForm<NewNote>();

    const handleFormSubmit = (event: FormEvent) => {
        event.preventDefault();

        void handleSubmit(({ files }) => {
            const formData = new FormData();

            if (files.length === 0) {
                throw new Error("Please select a file");
            }

            formData.append("file", files[0] as File);

            const requestConfig: AxiosRequestConfig = {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            };

            void axios.post("/api/notes", formData, requestConfig);
        })();
    };

    return (
        <form onSubmit={handleFormSubmit}>
            <input type="file" {...register("files")} />
            <button className="bg-sky-400 p-2 text-white" type="submit">
                上傳
            </button>
        </form>
    );
};
