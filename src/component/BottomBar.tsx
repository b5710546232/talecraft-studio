import packageInfo from 'package.json'
export const BottomBar = () => {
    return (
      <>
        <div className="h-10 w-full border-t px-4 text-gray-500 flex flex-col sm:flex-row flex-1 sm:justify-between">
        <div className="flex items-center py-1 justify-end sm:justify-start">
            ver. {packageInfo?.version}
            </div>
          <div className="flex h-full items-center justify-end py-1">
            <div className="text-sm">© Copyright TaleCaft Studio 2023 All rights reserved.</div>
          </div>
        </div>
      </>
    )
  }