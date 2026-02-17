const Loader = () => {
  return (
    <div className="flex items-center justify-center p-12 animate-fade-in">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-primary-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-600 animate-spin"></div>
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-primary-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
      </div>
    </div>
  );
};

export default Loader;

