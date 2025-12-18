import { requireSession } from "@/lib/getSession";

export default async function UserInfoCard() {
  const session = await requireSession();
  if (!session?.user) {
    return null;
  }
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {session.user.name?.split(" ")[0].charAt(0).toUpperCase() +
                  session.user.name?.split(" ")[0].slice(1).toLowerCase()}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {(() => {
                  const name = session?.user?.name;
                  if (!name) return "";
                  const last = name.split(" ").pop()!;
                  return (
                    last.charAt(0).toUpperCase() + last.slice(1).toLowerCase()
                  );
                })()}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {session.user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Personal Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {session.user.personalEmail || "Not Added"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
