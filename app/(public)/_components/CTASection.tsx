const CtaSection = () => {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5">
        <div className="p-6 sm:p-10 md:p-14 lg:p-8 flex flex-col space-y-6 relative">
          <div className="lg:h-full flex flex-col items-center text-center justify-center space-y-8 mx-auto max-w-2xl">
            <h1 className="font-bold text-gray-900 dark:text-white text-4xl">
              Join other{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-bl from-blue-700 to-violet-400 dark:from-blue-300 dark:to-violet-400">
                Amazing
              </span>{" "}
              students who trust CampusHub
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-center max-w-xl">
              Join our Newsletter to get latest updates and improvements on the
              platform.
            </p>
            <form className="w-full flex flex-col sm:items-center sm:flex-row gap-y-3 gap-x-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="johndoe@gmail.com"
                className="py-3 px-5 rounded-lg text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 outline-none border border-gray-300 dark:border-gray-600 w-full placeholder:text-gray-600 dark:placeholder:text-gray-300"
              />
              <button className="py-3 rounded-lg px-6 bg-blue-600 dark:bg-blue-500 text-white font-medium text-base w-full sm:w-max flex justify-center cursor-pointer hover:bg-blue-700">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
