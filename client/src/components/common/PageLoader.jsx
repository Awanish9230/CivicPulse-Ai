import { motion } from 'framer-motion';

const PageLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <motion.div 
                        className="absolute inset-0 rounded-full border-4 border-primary/20"
                    />
                    <motion.div 
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                </div>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-primary font-bold tracking-widest text-sm uppercase"
                >
                    Loading...
                </motion.div>
            </div>
        </div>
    );
};

export default PageLoader;
