"use client"

import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { RecoilRoot } from "recoil";
import AppLayout from "./AppLayout";


export default function Provider({children}:{children: ReactNode}) {

    // const AppLayout = dynamic(
    //     () => import('./AppLayout'),
    //     { ssr: false }
    //   )

    console.log("rendering provider")

    return (
        <RecoilRoot>
            <AppLayout>
                {children}
            </AppLayout>
        </RecoilRoot>
    );
}