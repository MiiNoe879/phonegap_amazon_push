describe('Plugin object (window.plugins)', function () {
	it("should exist", function() {
        expect(window.plugins).toBeDefined();
	});

	it("should contain a pushNotification object", function() {
        expect(window.plugins.pushNotification).toBeDefined();
		expect(typeof window.plugins.pushNotification == 'object').toBe(true);
	});

    it("should contain a register function", function() {
        expect(window.plugins.pushNotification.register).toBeDefined();
        expect(typeof window.plugins.pushNotification.register == 'function').toBe(true);
    });
    
    it("should contain an unregister function", function() {
        expect(window.plugins.pushNotification.unregister).toBeDefined();
        expect(typeof window.plugins.pushNotification.unregister == 'function').toBe(true);
    });
    
    it("should contain a setApplicationIconBadgeNumber function", function() {
        expect(window.plugins.pushNotification.setApplicationIconBadgeNumber).toBeDefined();
        expect(typeof window.plugins.pushNotification.setApplicationIconBadgeNumber == 'function').toBe(true);
    });
});
