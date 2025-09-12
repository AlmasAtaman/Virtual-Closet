import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";


const useQuery = (url: string) => {
    const [state, setState] = useState({
        data: null,
        isLoading: true,
        error: '',
    });

    useEffect(() => {
        const fetch = async () => {
        try {
            const { data } = await axios.get(url, { withCredentials: true });

            setState({ data, isLoading: false, error: "" });
        } catch (error: unknown) {
            const axiosError = error as AxiosError;
            const message = axiosError.message || 'An error occurred';
            setState({ data: null, isLoading: false, error: message });
        }
    };

    fetch();
  }, [url]);

  return state;
};

export default useQuery;
