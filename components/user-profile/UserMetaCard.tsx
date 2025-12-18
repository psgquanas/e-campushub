import { requireSession } from "@/lib/getSession";
import UserAvatarUpload from "./UserAvatarUpload";
import Image from "next/image";

export default async function UserMetaCard() {
  const session = await requireSession();
  if (!session?.user) {
    return null;
  }
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <UserAvatarUpload
              currentImage={session.user.image || null}
              userName={session.user.name}
            />
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {session.user.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Student
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  University of Education, Winneba
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
