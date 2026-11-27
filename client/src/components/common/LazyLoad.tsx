import { ReactNode, Suspense } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyLoadProps {
    children: ReactNode;
    height?: string;
    rootMargin?: string;
}

const LazyLoad = ({ children, height = '400px', rootMargin = '200px 0px' }: LazyLoadProps) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin,
    });

    return (
        <div ref={ref} style={{ minHeight: inView ? 'auto' : height }}>
            {inView ? (
                <Suspense fallback={<div style={{ height }} className="animate-pulse bg-slate-50/50 rounded-3xl w-full flex items-center justify-center text-slate-400">Loading section...</div>}>
                    {children}
                </Suspense>
            ) : null}
        </div>
    );
};

export default LazyLoad;
