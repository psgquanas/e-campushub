const iconRender = (val: "stat-ico" | string) => {
  switch (val) {
    case "stat-ico":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      );
    default:
      return <>No Icon</>;
  }
};

interface FeatureItemProps {
  title: string;
  description: string;
  icon: string; // or: icon: "stat-ico" | "user" | ...
  id: number;
}

const FeatureItem = ({ title, description, icon, id }: FeatureItemProps) => {
  return (
    <div
      className={` space-y-4 
        ${
          id === 1
            ? "sm:pr-4 pb-4"
            : id === 2
              ? "pt-4 sm:pt-0 sm:pl-4 pb-4 sm:border-t-transparent!"
              : id === 3
                ? "sm:pr-4 pt-4 sm:border-l-transparent!"
                : "sm:pl-4 pt-4"
        }
        `}
    >
      <span className="p-2 rounded-md bg-blue-50 text-blue-700 dark:bg-gray-900 dark:text-blue-500 flex w-max">
        {iconRender(icon)}
      </span>
      <h1 className="flex text-lg font-semibold capitalize text-gray-900 dark:text-white">
        {title}
      </h1>
      <p className="text-sm font-light text-gray-700 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
};

const features = [
  {
    id: 1,
    title: "Past Questions Repository",
    description:
      "Access past exam papers and quizzes to study smarter and ace your tests with confidence.",
    icon: "stat-ico",
  },
  {
    id: 2,
    title: "Course Materials & Notes",
    description:
      "Share and download lecture notes, slides, and study materials from your peers.",
    icon: "stat-ico",
  },
  {
    id: 3,
    title: "Anonymous Forum",
    description:
      "Ask questions, share confessions, and connect with fellow students without judgement.",
    icon: "stat-ico",
  },
  {
    id: 4,
    title: "Campus Updates & Events",
    description:
      "Stay in the loop with real-time announcements, events, and everything happening on campus.",
    icon: "stat-ico",
  },
];

const Features = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5">
        <div className="flex flex-col gap-5">
          <div className="space-y-4 max-w-xl">
            <span className="rounded-lg bg-blue-50 dark:bg-gray-900 px-2.5 py-1 text-xs font-semibold tracking-wide text-sky-800 dark:text-gray-100">
              Feature
            </span>
            <h1 className="text-3xl font-semibold text-blue-950 dark:text-gray-200 md:text-4xl xl:text-5xl leading-tight">
              The platform that transforms your campus experience
            </h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            CampusHub is a comprehensive platform designed to enhance your
            campus experience, offering a range of features to support your
            academic journey, social interactions, and overall well-being.
          </p>
        </div>
        <div className="mt-16 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-10 xl:gap-14">
          <div className="lg:w-[55%] lg:items-center grid sm:grid-cols-2  sm:divide-x divide-y divide-gray-300 dark:divide-gray-800">
            {features.map((feature) => (
              <FeatureItem key={feature.id} {...feature} />
            ))}
          </div>
          <div className="flex-1 py-10 lg:py-8 space-y-8 max-w-2xl">
            <h2 className="text-4xl font-semibold text-gray-900 dark:text-white">
              Connect, learn, and thrive on campus
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-md">
              CampusHub empowers students to connect, learn, and thrive on
              campus. Our platform offers a range of features to support your
              academic journey, social interactions, and overall well-being.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
