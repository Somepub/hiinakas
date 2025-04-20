import { useMediaQuery } from '@hooks/useMediaQuery'

interface IsMobileOptions {
    tablet?: boolean;
}

export const useIsMobile = (options: IsMobileOptions = { tablet: false }): boolean => {
    const { tablet } = options;
    
    const query = tablet 
        ? '(max-width: 1023px)'
        : '(max-width: 767px)';
    
    return useMediaQuery(query);
};