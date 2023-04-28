import React from 'react'
import * as Menubar from '@radix-ui/react-menubar';
import Image from 'next/image'
import { signOut } from 'next-auth/react'
interface Props {
  userImg: string
}
export const ProfileDropdownMenu: React.FC<Props> = ({ userImg }) => {
  function onOpenChange(open: boolean) {
    document.body.style.paddingRight = open ? "0px" : "";
}
  return (<>
  
  <Menubar.Root className="flex">
      <Menubar.Menu>
        <Menubar.Trigger className="flex h-6 w-6 items-center justify-center rounded-full bg-white outline-none">
          <Image width={24} height={24} alt="profile-img" className="rounded-full" src={userImg} />
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content
            className="min-w-[100px] bg-white rounded shadow"
            align="end"
            sideOffset={5}
            alignOffset={-3}
          >
            <Menubar.Item className="group leading-none text-gray-700 ">
            <button onClick={() => void signOut()} className="rounded bg-white hover:bg-black/10 w-full px-2 py-1 text-gray-700 outline-none">
                <div className="text-xs">logout</div>
            </button>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
    </>
  )
}
