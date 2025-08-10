import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react'
import type { ToolCallContentPartProps } from "@assistant-ui/react";

const getPokemon = async (name: string | undefined) => {
    if (!name) return
    const response = await fetch(name)
    return response.json()
}

export const GetPokemonEndpoint: FC<ToolCallContentPartProps> = (props) => {
    const { data } = useQuery({
        queryKey: ['pokemon'],
        // @ts-expect-error - result is not typed
        queryFn: () => getPokemon(props.result.info)
    })

    console.log(data)

    return <div>GetPokemonEndpoint</div>;
};